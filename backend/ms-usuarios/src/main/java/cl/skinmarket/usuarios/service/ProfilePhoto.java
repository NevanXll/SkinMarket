package cl.skinmarket.usuarios.service;

import cl.skinmarket.common.exception.ApiException;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;
import javax.imageio.ImageIO;
import javax.imageio.stream.MemoryCacheImageInputStream;
import org.springframework.http.HttpStatus;

final class ProfilePhoto {
    private static final String JPEG_PREFIX = "data:image/jpeg;base64,";
    private static final int MAX_SIDE = 256;

    private ProfilePhoto() {}

    static String normalize(String value) {
        if (value.isEmpty()) return null;
        if (!value.startsWith(JPEG_PREFIX)) throw invalid();
        try {
            byte[] bytes = Base64.getDecoder().decode(value.substring(JPEG_PREFIX.length()));
            try (var input = new MemoryCacheImageInputStream(new ByteArrayInputStream(bytes))) {
                var readers = ImageIO.getImageReaders(input);
                if (!readers.hasNext()) throw invalid();
                var reader = readers.next();
                try {
                    reader.setInput(input, true, true);
                    if (!"JPEG".equalsIgnoreCase(reader.getFormatName())
                            || reader.getWidth(0) > MAX_SIDE || reader.getHeight(0) > MAX_SIDE) {
                        throw invalid();
                    }
                    var encoded = new ByteArrayOutputStream();
                    if (!ImageIO.write(reader.read(0), "jpeg", encoded)) throw invalid();
                    return JPEG_PREFIX + Base64.getEncoder().encodeToString(encoded.toByteArray());
                } finally {
                    reader.dispose();
                }
            }
        } catch (IllegalArgumentException | IOException e) {
            throw invalid();
        }
    }

    private static ApiException invalid() {
        return new ApiException(HttpStatus.BAD_REQUEST, "Selecciona una imagen de perfil válida.");
    }
}
