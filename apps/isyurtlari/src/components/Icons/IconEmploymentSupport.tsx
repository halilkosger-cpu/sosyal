interface IconProps {
  className?: string;
  ariaLabel?: string;
}

export function IconEmploymentSupport({ className = "w-6 h-6" }: Omit<IconProps, 'ariaLabel'>) {
  return (
    <img
      src="/sosyal_giris_isyurtlari_icons/svg/10_employment_support_istihdam_destegi.svg"
      alt=""
      aria-hidden="true"
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}
