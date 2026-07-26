import type { ComponentPropsWithoutRef } from "react";

export type AgentImageProps = Omit<ComponentPropsWithoutRef<"img">, "alt"> & {
  alt: string;
};

/**
 * Native image element for agent-provided blob, data, remote, and authenticated
 * attachment URLs that cannot be represented by a static Next.js allowlist.
 */
export function AgentImage({ alt, ...props }: AgentImageProps) {
  // eslint-disable-next-line @next/next/no-img-element -- Agent URLs may be blob/data URLs or authenticated remote resources that Next Image cannot safely optimize.
  return <img alt={alt} {...props} />;
}
