import { env } from "@/lib/config/env";

export default function Home() {
  void env.apiBaseUrl;

  return (
    <main>
      <h1>QuickSeat frontend foundation</h1>
      <p>Project setup is ready for the next development phase.</p>
    </main>
  );
}
