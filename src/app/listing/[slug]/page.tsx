export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }> | { slug: string };
  searchParams: Promise<Record<string, any>> | Record<string, any>;
};

async function resolve<T>(v: T | Promise<T>): Promise<T> {
  return v && typeof (v as any).then === "function" ? await (v as any) : (v as any);
}

export default async function ListingPage(props: PageProps) {
  const params = await resolve(props.params);
  const searchParams = await resolve(props.searchParams);

  const slug = params?.slug;

  return (
    <div style={{ color: "white", padding: 50 }}>
      <h1>PARAM DEBUG</h1>
      <div>slug (awaited): {String(slug)}</div>
      <pre style={{ marginTop: 20 }}>params: {JSON.stringify(params, null, 2)}</pre>
      <pre style={{ marginTop: 20 }}>searchParams: {JSON.stringify(searchParams, null, 2)}</pre>
    </div>
  );
}
