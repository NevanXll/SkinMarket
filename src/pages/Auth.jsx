import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ShieldCheck, Crosshair } from "lucide-react";
import { useMarket } from "../context/MarketContext";
import { validateAuth } from "../lib/market";
export default function Auth() {
  const { login, register } = useMarket();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [values, setValues] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState("");
  const [pending, setPending] = useState(false);
  const isRegister = mode === "register";
  async function submit(e) {
    e.preventDefault();
    setFailure("");
    const errors = validateAuth(values, isRegister);
    setErrors(errors);
    if (Object.keys(errors).length) return;
    if (pending) return;
    setPending(true);
    try {
      if (isRegister) {
        await register(values);
        navigate("/productos");
      } else {
        const account = await login(values);
        navigate({ admin: "/admin", seller: "/vendedor", client: "/productos" }[account.role]);
      }
    } catch (e) {
      setFailure(e.message);
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="auth-layout row g-0">
      <section className="auth-story col-12 col-lg-6">
        <span className="eyebrow">BIENVENIDO A SKINMARKET PRO</span>
        <h1>
          NO ES SOLO{" "}
          <br />
          UNA SKIN.{" "}
          <br />
          <em>ES TU ESTILO.</em>
        </h1>
        <p>
          Elige lo que te representa.
          <br />
          Haz tuya la próxima partida.
        </p>
        <Crosshair className="auth-crosshair" />
        <span className="auth-bottom">
          COUNTER-STRIKE 2 / NEXT LEVEL LOADOUT
        </span>
      </section>
      <section className="auth-panel col-12 col-lg-6">
        <div className="auth-tabs">
          <button
            className={!isRegister ? "active" : ""}
            onClick={() => {
              setMode("login");
              setErrors({});
              setFailure("");
            }}
          >
            Iniciar sesión
          </button>
          <button
            className={isRegister ? "active" : ""}
            onClick={() => {
              setMode("register");
              setErrors({});
              setFailure("");
            }}
          >
            Crear cuenta
          </button>
        </div>
        <h2>
          {isRegister
            ? "Tu nueva partida empieza aquí."
            : "Bienvenido de vuelta."}
        </h2>
        <p className="muted">
          {isRegister
            ? "Crea tu cuenta y recibe 12.500 USD de saldo virtual."
            : "Accede a tu inventario y continúa explorando."}
        </p>
        <form noValidate onSubmit={submit}>
          {(isRegister
            ? ["name", "email", "password"]
            : ["email", "password"]
          ).map((key) => (
            <label key={key}>
              {
                {
                  name: "Nombre",
                  email: "Correo electrónico",
                  password: "Contraseña",
                }[key]
              }
              <input
                aria-label={
                  {
                    name: "Nombre",
                    email: "Correo electrónico",
                    password: "Contraseña",
                  }[key]
                }
                id={`auth-${key}`}
                className={`form-control ${errors[key] ? "is-invalid" : ""}`}
                name={key}
                type={
                  key === "password"
                    ? "password"
                    : key === "email"
                      ? "email"
                      : "text"
                }
                autoComplete={
                  key === "password"
                    ? isRegister
                      ? "new-password"
                      : "current-password"
                    : key === "name"
                      ? "name"
                      : "email"
                }
                value={values[key]}
                onChange={(e) =>
                  setValues({ ...values, [key]: e.target.value })
                }
                aria-invalid={!!errors[key]}
                aria-describedby={errors[key] ? `error-${key}` : undefined}
              />
              {errors[key] && (
                <span className="field-error invalid-feedback" id={`error-${key}`}>
                  {errors[key]}
                </span>
              )}
            </label>
          ))}
          {failure && (
            <p role="alert" className="field-error">
              {failure}
            </p>
          )}
          <button className="button full-width" disabled={pending} aria-busy={pending}>
            {isRegister ? "Crear mi cuenta" : "Entrar a SkinMarket"}
            <ArrowRight size={16} />
          </button>
        </form>
        <p className="security-note">
          <ShieldCheck size={15} />
          Contraseñas protegidas con BCrypt. Sesión validada por el servidor.
        </p>
        <Link className="text-link" to="/productos">
          Seguir explorando el mercado →
        </Link>
      </section>
    </div>
  );
}
