import Image from "next/image";
import styles from "../styles";

export function AuthHero() {
  return (
    <section className={styles.hero} aria-hidden="true">
      <Image
        src="/auth-hero.jpg"
        alt=""
        fill
        className={styles.heroImage}
        priority
        sizes="(max-width: 768px) 100vw, 50vw"
      />
      <div className={styles.heroOverlay} />
      <div className={styles.heroContent}>
        <h1 className={styles.logo}>
          Bernabé
        </h1>
        <p className={styles.tagline}>
          Organiza los servidores de tu iglesia sin caos.
        </p>
      </div>
    </section>
  );
}
