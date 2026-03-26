"use client";

import Link from "next/link";
import styles from "../styles";

export function RegisterForm() {
  return (
    <div className="w-full max-w-sm mx-auto md:mx-0">
      <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
        Crear cuenta
      </h2>
      <p className="mt-2 text-slate-500">
        Regístrate como líder o servidor para comenzar.
      </p>
      <form className="mt-8 space-y-5" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label htmlFor="name" className={styles.label}>
            Nombre
          </label>
          <input
            id="name"
            type="text"
            name="name"
            autoComplete="name"
            placeholder="Tu nombre"
            className={styles.input}
          />
        </div>
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
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            className={styles.input}
          />
        </div>
        <button type="submit" className={styles.button}>
          Crear cuenta
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className={styles.link}>
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
