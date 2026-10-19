import { useState } from "react";
import {
  Pencil,
  Search,
  ShieldCheck,
  LockKeyhole,
  UnlockKeyhole,
  X,
} from "lucide-react";
import { useMarket } from "../context/MarketContext";
import { money } from "../lib/market";
import { validateAccount } from "../lib/admin";
import Modal from "./Modal";

export default function AdminUsers() {
  const { state, user: actor, saveUser, notify } = useMarket();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState(null);
  const [errors, setErrors] = useState({});
  const [target, setTarget] = useState(null);
  const users = state.users.filter(
    (user) =>
      `${user.name} ${user.email}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()) &&
      (!role || role === user.role) &&
      (!status || (status === "blocked" ? !!user.blocked : !user.blocked)),
  );
  function edit(account) {
    setEditing({
      id: account.id,
      name: account.name,
      email: account.email,
      role: account.role,
    });
    setErrors({});
  }
  return (
    <section aria-label="Gestión de usuarios">
      <div className="users-heading">
        <div>
          <h2>Usuarios del mercado</h2>
          <p>
            Gestiona perfiles, roles y acceso. Se conservan sus compras e
            inventario.
          </p>
        </div>
        <span className="chart-chip">{users.length} cuentas</span>
      </div>
      <div className="users-toolbar">
        <label className="search-box">
          <Search size={16} />
          <input
            aria-label="Buscar usuario"
            placeholder="Buscar por nombre o correo…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label>
          Rol
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">Todos los roles</option>
            <option value="client">Cliente</option>
            <option value="admin">Administrador</option>
          </select>
        </label>
        <label>
          Estado
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos los estados</option>
            <option value="active">Activo</option>
            <option value="blocked">Bloqueado</option>
          </select>
        </label>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Saldo · {state.currency}</th>
              <th>Compras</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((account) => (
              <tr key={account.id}>
                <td>
                  <div className="user-identity">
                    <span className="avatar">{account.name[0]}</span>
                    <span>
                      {account.name}
                      {account.id === actor.id && (
                        <b className="you-label">Tú</b>
                      )}
                      <small>{account.email}</small>
                    </span>
                  </div>
                </td>
                <td>
                  <span className={`role-badge ${account.role}`}>
                    <ShieldCheck size={12} />
                    {account.role === "admin" ? "Administrador" : "Cliente"}
                  </span>
                </td>
                <td>
                  <span
                    className={account.blocked ? "out-badge" : "stock-badge"}
                  >
                    {account.blocked ? "Bloqueado" : "Activo"}
                  </span>
                </td>
                <td>{money(account.balance, state.currency)}</td>
                <td>{account.orders.length}</td>
                <td>
                  <div className="table-actions">
                    <button
                      className="icon-button"
                      aria-label={`Editar usuario ${account.name}`}
                      onClick={() => edit(account)}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className={`icon-button ${account.blocked ? "" : "danger"}`}
                      aria-label={`${account.blocked ? "Desbloquear" : "Bloquear"} usuario ${account.name}`}
                      disabled={account.id === actor.id}
                      title={
                        account.id === actor.id
                          ? "No puedes bloquear tu propia cuenta"
                          : undefined
                      }
                      onClick={() => setTarget(account)}
                    >
                      {account.blocked ? (
                        <UnlockKeyhole size={16} />
                      ) : (
                        <LockKeyhole size={16} />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!users.length && (
          <p className="empty-state">
            No encontramos usuarios con esos filtros.
          </p>
        )}
      </div>
      <p className="dashboard-scope">
        El bloqueo impide iniciar sesión y comprar. Las cuentas no se eliminan
        para conservar su historial. No se muestran contraseñas.
      </p>
      {editing && (
        <Modal onClose={() => setEditing(null)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-edit-title"
            className="market-modal"
          >
            <button
              className="icon-button modal-close"
              aria-label="Cerrar edición de usuario"
              onClick={() => setEditing(null)}
            >
              <X />
            </button>
            <span className="eyebrow">GESTIÓN DE CUENTAS</span>
            <h2 id="user-edit-title">Editar usuario</h2>
            <form
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                const found = validateAccount(editing, state.users, editing.id);
                setErrors(found);
                if (Object.keys(found).length) return;
                try {
                  saveUser(editing.id, editing);
                  setEditing(null);
                } catch (error) {
                  setErrors({ form: error.message });
                }
              }}
            >
              {["name", "email"].map((key) => (
                <label key={key}>
                  {key === "name" ? "Nombre del usuario" : "Correo del usuario"}
                  <input
                    aria-label={
                      key === "name"
                        ? "Nombre del usuario"
                        : "Correo del usuario"
                    }
                    value={editing[key]}
                    type={key === "email" ? "email" : "text"}
                    aria-invalid={!!errors[key]}
                    onChange={(e) =>
                      setEditing({ ...editing, [key]: e.target.value })
                    }
                  />
                  {errors[key] && (
                    <span className="field-error">{errors[key]}</span>
                  )}
                </label>
              ))}
              <label>
                Rol del usuario
                <select
                  value={editing.role}
                  disabled={editing.id === actor.id}
                  onChange={(e) =>
                    setEditing({ ...editing, role: e.target.value })
                  }
                >
                  <option value="client">Cliente</option>
                  <option value="admin">Administrador</option>
                </select>
                {errors.role && (
                  <span className="field-error">{errors.role}</span>
                )}
              </label>
              <p className="dashboard-scope">
                Un administrador puede gestionar productos y otras cuentas. No
                puedes quitarte tu propio rol.
              </p>
              {errors.form && (
                <p className="field-error" role="alert">
                  {errors.form}
                </p>
              )}
              <div className="modal-actions">
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setEditing(null)}
                >
                  Cancelar
                </button>
                <button className="button">Guardar usuario</button>
              </div>
            </form>
          </section>
        </Modal>
      )}
      {target && (
        <Modal onClose={() => setTarget(null)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-status-title"
            className="market-modal"
          >
            <h2 id="user-status-title">
              ¿{target.blocked ? "Desbloquear" : "Bloquear"} a {target.name}?
            </h2>
            <p>
              {target.blocked
                ? "Podrá volver a iniciar sesión y comprar con sus datos existentes."
                : "No podrá iniciar sesión ni comprar. Su saldo, inventario e historial se conservarán."}
            </p>
            <div className="modal-actions">
              <button
                className="button secondary"
                onClick={() => setTarget(null)}
              >
                Cancelar
              </button>
              <button
                className={`button ${target.blocked ? "" : "danger-button"}`}
                onClick={() => {
                  try {
                    saveUser(target.id, { blocked: !target.blocked });
                    setTarget(null);
                  } catch (error) {
                    notify(error.message, "error");
                  }
                }}
              >
                Confirmar {target.blocked ? "desbloqueo" : "bloqueo"}
              </button>
            </div>
          </section>
        </Modal>
      )}
    </section>
  );
}
