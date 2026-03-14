const LogoIcon = ({
  width = 705,
  height = 728,
  fill = "white",
}: SvgIconProps) => {
  return (
    <svg width={width} height={height} viewBox="0 0 705 728" fill="none">
      <ellipse cx="24" cy="363.529" rx="24" ry="213.785" fill={fill} />
      <ellipse cx="145.5" cy="364" rx="66.5" ry="278.298" fill={fill} />
      <ellipse cx="383" cy="364" rx="138" ry="364" fill={fill} />
      <ellipse cx="627.5" cy="364" rx="77.5" ry="249.102" fill={fill} />
    </svg>
  );
};

export default LogoIcon;
