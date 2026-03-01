export async function buyExamPin(params: {
  examType: string;
  quantity: number;
}) {
  const res = await fetch("/api/services/exam-pins", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Exam pin purchase failed");
  }

  return res.json();
}
