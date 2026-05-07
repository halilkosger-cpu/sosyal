interface IconProps {
  className?: string;
  ariaLabel?: string;
}

export function IconTransferInfo({ className = "w-6 h-6" }: Omit<IconProps, 'ariaLabel'>) {
  return (
    <img
      src="/sosyal_giris_isyurtlari_icons/svg/20_transfer_info_havale_bilgileri.svg"
      alt=""
      aria-hidden="true"
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}
