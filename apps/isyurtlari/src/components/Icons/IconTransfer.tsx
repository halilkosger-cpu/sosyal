interface IconProps {
  className?: string;
  ariaLabel?: string;
}

export function IconTransfer({ className = "w-6 h-6" }: Omit<IconProps, 'ariaLabel'>) {
  return (
    <img
      src="/sosyal_giris_isyurtlari_icons/svg/17_bank_transfer_havale_eft.svg"
      alt=""
      aria-hidden="true"
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}
