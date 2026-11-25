package cl.skinmarket.usuarios.service;

import cl.skinmarket.common.exception.ApiException;
import cl.skinmarket.common.model.Account;
import cl.skinmarket.common.model.SellerApplication;
import cl.skinmarket.common.repository.AccountRepository;
import cl.skinmarket.common.repository.SellerApplicationRepository;
import java.time.Instant;
import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SellerApplicationService {
    private final AccountRepository accounts;
    private final SellerApplicationRepository applications;

    public SellerApplicationService(AccountRepository accounts, SellerApplicationRepository applications) {
        this.accounts = accounts;
        this.applications = applications;
    }

    @Transactional(readOnly = true)
    public ApplicationView current(String userId) {
        var account = accounts.findById(userId).orElseThrow(ApiException::missing);
        return applications.findById(userId).map(application -> view(application, account)).orElse(null);
    }

    @Transactional
    public ApplicationView submit(String userId, String skins, String reason) {
        var account = accounts.lockById(userId).orElseThrow(ApiException::missing);
        if (account.blocked || !"CLIENTE".equals(account.role)) {
            throw ApiException.denied();
        }
        var application = applications.findById(userId).orElseGet(SellerApplication::new);
        if ("PENDIENTE".equals(application.status)) {
            throw ApiException.conflict("Tu solicitud ya está en revisión.");
        }
        if (skins.strip().length() < 3 || reason.strip().length() < 10) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Describe las skins y el motivo de tu solicitud.");
        }
        application.userId = userId;
        application.skins = skins.strip();
        application.reason = reason.strip();
        application.status = "PENDIENTE";
        application.submittedAt = Instant.now();
        application.reviewedAt = null;
        application.reviewNote = null;
        return view(applications.save(application), account);
    }

    @Transactional(readOnly = true)
    public List<ApplicationView> list() {
        var rows = applications.findAllByOrderBySubmittedAtDesc();
        var applicants = accounts.findAllById(rows.stream().map(row -> row.userId).toList()).stream()
                .collect(Collectors.toMap(account -> account.id, Function.identity()));
        return rows.stream().filter(row -> applicants.containsKey(row.userId))
                .map(row -> view(row, applicants.get(row.userId))).toList();
    }

    @Transactional
    public ApplicationView review(String userId, boolean approved, String note) {
        var account = accounts.lockById(userId).orElseThrow(ApiException::missing);
        var application = applications.findById(userId).orElseThrow(ApiException::missing);
        if (!"PENDIENTE".equals(application.status)) {
            throw ApiException.conflict("La solicitud ya fue revisada.");
        }
        if (approved && (account.blocked || !"CLIENTE".equals(account.role))) {
            throw ApiException.conflict("Solo se puede aprobar a clientes activos.");
        }
        if (!approved && (note == null || note.isBlank())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Indica el motivo del rechazo.");
        }
        application.status = approved ? "APROBADA" : "RECHAZADA";
        application.reviewedAt = Instant.now();
        application.reviewNote = note == null || note.isBlank() ? null : note.strip();
        if (approved) {
            // SecurityConfig loads the current role from the account on every authenticated request.
            account.role = "VENDEDOR";
        }
        return view(application, account);
    }

    private ApplicationView view(SellerApplication application, Account account) {
        return new ApplicationView(account.id, account.name, account.email, application.skins,
                application.reason, application.status, application.submittedAt, application.reviewedAt,
                application.reviewNote);
    }

    public record ApplicationView(String userId, String name, String email, String skins, String reason,
                                  String status, Instant submittedAt, Instant reviewedAt, String reviewNote) {}
}
