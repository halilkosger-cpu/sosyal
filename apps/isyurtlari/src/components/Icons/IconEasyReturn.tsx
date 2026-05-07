interface IconProps {
  className?: string;
  ariaLabel?: string;
}

export function IconEasyReturn({ className = "w-6 h-6" }: Omit<IconProps, 'ariaLabel'>) {
  return (
    <img
      src="/sosyal_giris_isyurtlari_icons/svg/22_easy_return_kolay_iade.svg"
      alt=""
      aria-hidden="true"
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}
