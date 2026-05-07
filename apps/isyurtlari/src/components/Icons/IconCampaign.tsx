interface IconProps {
  className?: string;
  ariaLabel?: string;
}

export function IconCampaign({ className = "w-6 h-6" }: Omit<IconProps, 'ariaLabel'>) {
  return (
    <img
      src="/sosyal_giris_isyurtlari_icons/svg/15_campaign_discount_kampanya_indirim.svg"
      alt=""
      aria-hidden="true"
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}
