import { useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";
import CountUp from "react-countup";
import { cn } from "@/lib/utils";

interface StatsCounterProps {
  end: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  className?: string;
}

export const StatsCounter = ({
  end,
  duration = 2,
  suffix = "",
  prefix = "",
  decimals = 0,
  className,
}: StatsCounterProps) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.3,
  });
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (inView && !hasAnimated) {
      setHasAnimated(true);
    }
  }, [inView, hasAnimated]);

  return (
    <span ref={ref} className={cn("font-bold", className)}>
      {hasAnimated ? (
        <CountUp
          end={end}
          duration={duration}
          suffix={suffix}
          prefix={prefix}
          decimals={decimals}
        />
      ) : (
        `${prefix}0${suffix}`
      )}
    </span>
  );
};
