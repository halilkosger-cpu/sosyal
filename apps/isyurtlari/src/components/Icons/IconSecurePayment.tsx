interface IconProps {
  className?: string;
  ariaLabel?: string;
}

export function IconSecurePayment({ className = "w-6 h-6", ariaLabel = "G?venli ?deme" }: IconProps) {
  return (
    <img
      src="/sosyal_giris_isyurtlari_icons/svg/24_secure_payment_guvenli_odeme.svg"
      alt=""
      aria-label={ariaLabel}
      role="img"
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}
