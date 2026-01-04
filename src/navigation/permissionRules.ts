export type MenuRule = {
  anyOf?: string[];
  allOf?: string[];
};

export const canAccessRule = (rule: MenuRule | undefined, permissions: string[]): boolean => {
  if (!rule) return true;
  const anyOf = rule.anyOf ?? [];
  const allOf = rule.allOf ?? [];
  const hasAny = anyOf.length === 0 || anyOf.some((permission) => permissions.includes(permission));
  const hasAll = allOf.length === 0 || allOf.every((permission) => permissions.includes(permission));
  return hasAny && hasAll;
};
