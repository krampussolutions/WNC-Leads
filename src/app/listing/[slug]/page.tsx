export default function ListingPage({ params }: { params: { slug: string } }) {
  return (
    <div style={{ color: "white", padding: 50 }}>
      <h1>LISTING PAGE WORKS</h1>
      <p>Slug: {params.slug}</p>
    </div>
  );
}
