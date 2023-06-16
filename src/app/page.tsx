import { db } from "@/lib/db";

// oh yeah, this is the future
export const runtime = "edge";

export default async function Home() {
  const flocks = await db.query.flock.findMany({
    with: {
      breeds: true,
    },
  });

  return (
    <>
      <p>Flocks:</p>
      {flocks.map((flock) => (
        <div key={flock.id}>{flock.name}</div>
      ))}
    </>
  );
}
