export const BrandMark = ({
  size = 56,
  className,
}: {
  size?: number;
  className?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 56 56"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect
      x="2"
      y="2"
      width="52"
      height="52"
      rx="14"
      stroke="currentColor"
      strokeWidth="2"
      fill="transparent"
    />
    <text
      x="50%"
      y="50%"
      dominantBaseline="central"
      textAnchor="middle"
      fontFamily="ui-sans-serif, system-ui"
      fontSize="20"
      fontWeight="600"
      fill="currentColor"
    >
      D·A
    </text>
  </svg>
);

export default BrandMark;
