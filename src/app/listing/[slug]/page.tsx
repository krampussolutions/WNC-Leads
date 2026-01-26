export const dynamic = "force-dynamic";

export default function ListingPage({ params, searchParams }: any) {
  const slug = params?.slug;

  return (
    <div style={{ color: "white", padding: 50 }}>
      <h1>PARAM DEBUG</h1>

      <div>slug (direct): {String(slug)}</div>
      <div>keys(params): {JSON.stringify(Object.keys(params ?? {}))}</div>
      <div>ownProps(params): {JSON.stringify(Object.getOwnPropertyNames(params ?? {}))}</div>

      <pre style={{ marginTop: 20 }}>
        props.params (stringify): {JSON.stringify(params, null, 2)}
      </pre>

      <pre style={{ marginTop: 20 }}>
        searchParams: {JSON.stringify(searchParams, null, 2)}
      </pre>
    </div>
  );
}
