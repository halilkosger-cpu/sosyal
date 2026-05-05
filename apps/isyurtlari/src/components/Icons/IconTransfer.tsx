interface IconProps {
  className?: string;
  ariaLabel?: string;
}

export function IconTransfer({ className = "w-6 h-6", ariaLabel = "Havale / EFT" }: IconProps) {
  return (
    <img
      src="/sosyal_giris_isyurtlari_icons/svg/17_bank_transfer_havale_eft.svg"
      alt=""
      aria-label={ariaLabel}
      role="img"
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}
