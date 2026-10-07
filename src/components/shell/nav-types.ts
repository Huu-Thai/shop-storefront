/** Navigation items after store prefixes are applied (server → client). */
export interface NavItem {
  id: string;
  label: string;
  href: string;
  external: boolean;
  newTab: boolean;
  children: NavItem[];
}
