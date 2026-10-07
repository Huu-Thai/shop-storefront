import { describe, expect, it } from 'vitest';
import { categoriesToNav, menuToNav } from './shell';

describe('navigation from the shop', () => {
  it('prefixes storefront links and keeps external ones', () => {
    const nav = menuToNav(
      [
        {
          id: '1',
          label: 'Men',
          url: '/men',
          linkType: 'CATEGORY',
          openInNewTab: false,
          children: [],
        },
        {
          id: '2',
          label: 'Blog',
          url: 'https://blog.example',
          linkType: 'URL',
          openInNewTab: true,
          children: [],
        },
      ] as never,
      '/vn-vi',
    );
    expect(nav.map((n) => [n.href, n.external, n.newTab])).toEqual([
      ['/vn-vi/men', false, false],
      ['https://blog.example', true, true],
    ]);
  });

  it('builds category links from url paths and hides categories kept out of menus', () => {
    const nav = categoriesToNav(
      [
        {
          id: 'a',
          name: 'Men',
          urlPath: 'men',
          includeInMenu: true,
          children: [
            { id: 'b', name: 'Tees', urlPath: 'men/t-shirts', includeInMenu: true, children: [] },
          ],
        },
        { id: 'c', name: 'Hidden', urlPath: 'hidden', includeInMenu: false, children: [] },
      ] as never,
      '',
      2,
    );
    expect(nav).toHaveLength(1);
    expect(nav[0].href).toBe('/men');
    expect(nav[0].children[0].href).toBe('/men/t-shirts');
  });
});
