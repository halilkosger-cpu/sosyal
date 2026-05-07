interface IconProps {
  className?: string;
  ariaLabel?: string;
}

export function IconVocationalTraining({ className = "w-6 h-6" }: Omit<IconProps, 'ariaLabel'>) {
  return (
    <img
      src="/sosyal_giris_isyurtlari_icons/svg/07_vocational_training_meslek_egitimi.svg"
      alt=""
      aria-hidden="true"
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}
