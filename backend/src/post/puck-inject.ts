export type PostInjectPayload = {
  title: string;
  body: string;
  excerpt: string | null;
  coverUrl: string | null;
  coverAlt: string | null;
  tags: { slug: string; name: string }[];
  category: string;
  eventStartAt: string | null;
  eventEndAt: string | null;
  eventLocation: string | null;
};

type PuckNode = {
  type?: string;
  props?: Record<string, unknown>;
  [key: string]: unknown;
};

type PuckTree = {
  root?: unknown;
  content?: PuckNode[];
  zones?: Record<string, PuckNode[]>;
  [key: string]: unknown;
};

const PLACEHOLDER_TYPES = new Set([
  'PostTitle',
  'PostBody',
  'PostCoverImage',
  'PostTagList',
  'PostEventInfo',
]);

const buildInjectedProps = (
  type: string,
  original: Record<string, unknown>,
  post: PostInjectPayload,
): Record<string, unknown> => {
  switch (type) {
    case 'PostTitle':
      return { ...original, text: post.title };
    case 'PostBody':
      return { ...original, markdown: post.body };
    case 'PostCoverImage':
      return {
        ...original,
        src: post.coverUrl ?? (original.src as string | undefined) ?? '',
        alt: post.coverAlt ?? post.title,
      };
    case 'PostTagList':
      return { ...original, tags: post.tags };
    case 'PostEventInfo':
      return {
        ...original,
        startAt: post.eventStartAt,
        endAt: post.eventEndAt,
        location: post.eventLocation,
      };
    default:
      return original;
  }
};

const walkNode = (node: PuckNode, post: PostInjectPayload): PuckNode => {
  if (!node || typeof node !== 'object') return node;
  const type = node.type;
  const originalProps = (node.props ?? {}) as Record<string, unknown>;

  const nextProps: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(originalProps)) {
    nextProps[key] = walkValue(value, post);
  }

  if (type && PLACEHOLDER_TYPES.has(type)) {
    return { ...node, props: buildInjectedProps(type, nextProps, post) };
  }
  return { ...node, props: nextProps };
};

const walkValue = (value: unknown, post: PostInjectPayload): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) =>
      item && typeof item === 'object' && 'type' in (item as object)
        ? walkNode(item as PuckNode, post)
        : walkValue(item, post),
    );
  }
  if (value && typeof value === 'object') {
    if ('type' in (value as object) && 'props' in (value as object)) {
      return walkNode(value as PuckNode, post);
    }
    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) out[k] = walkValue(v, post);
    return out;
  }
  return value;
};

export const injectPostIntoPuckData = (
  puckData: unknown,
  post: PostInjectPayload,
): PuckTree => {
  if (!puckData || typeof puckData !== 'object') {
    return { root: { props: {} }, content: [] };
  }
  const tree = JSON.parse(JSON.stringify(puckData)) as PuckTree;
  if (Array.isArray(tree.content)) {
    tree.content = tree.content.map((node) => walkNode(node, post));
  }
  if (tree.zones && typeof tree.zones === 'object') {
    const zones: Record<string, PuckNode[]> = {};
    for (const [zoneKey, zoneNodes] of Object.entries(tree.zones)) {
      zones[zoneKey] = Array.isArray(zoneNodes)
        ? zoneNodes.map((node) => walkNode(node, post))
        : zoneNodes;
    }
    tree.zones = zones;
  }
  return tree;
};
