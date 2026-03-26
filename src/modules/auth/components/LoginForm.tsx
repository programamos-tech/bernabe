"use client";

import Link from "next/link";
import styles from "../styles";

export function LoginForm() {
  return (
    <div className="w-full max-w-sm mx-auto md:mx-0">
      <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
        Iniciar sesión
      </h2>
      <p className="mt-2 text-slate-500">
        Entra a tu cuenta para gestionar tu iglesia.
      </p>
      <form className="mt-8 space-y-5" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label htmlFor="email" className={styles.label}>
            Correo
          </label>
          <input
            id="email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="tu@correo.com"
            className={styles.input}
          />
        </div>
        <div>
          <label htmlFor="password" className={styles.label}>
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className={styles.input}
          />
        </div>
        <button type="submit" className={styles.button}>
          Entrar
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        ¿Primera vez?{" "}
        <Link href="/register" className={styles.link}>
          Crear cuenta
        </Link>
      </p>
    </div>
  );
}
