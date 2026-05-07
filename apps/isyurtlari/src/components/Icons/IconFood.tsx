interface IconProps {
  className?: string;
  ariaLabel?: string;
}

export function IconFood({ className = "w-6 h-6" }: Omit<IconProps, 'ariaLabel'>) {
  return (
    <img
      src="/sosyal_giris_isyurtlari_icons/svg/01_food_gida.svg"
      alt=""
      aria-hidden="true"
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}
