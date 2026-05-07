interface IconProps {
  className?: string;
  ariaLabel?: string;
}

export function IconWood({ className = "w-6 h-6" }: Omit<IconProps, 'ariaLabel'>) {
  return (
    <img
      src="/sosyal_giris_isyurtlari_icons/svg/03_wood_ahsap.svg"
      alt=""
      aria-hidden="true"
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}
