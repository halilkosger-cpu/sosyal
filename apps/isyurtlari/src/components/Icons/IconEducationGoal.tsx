interface IconProps {
  className?: string;
  ariaLabel?: string;
}

export function IconEducationGoal({ className = "w-6 h-6", ariaLabel = "E?itim Hedefi" }: IconProps) {
  return (
    <img
      src="/sosyal_giris_isyurtlari_icons/svg/12_education_goal_egitim_hedefi.svg"
      alt=""
      aria-label={ariaLabel}
      role="img"
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}
