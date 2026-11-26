// Evenly distributes N points on a sphere surface using the golden-ratio (Fibonacci) spiral.
// Returns array of [x, y, z] tuples at the given radius.
export function fibonacciSphere(count: number, radius: number): [number, number, number][] {
  const points: [number, number, number][] = [];
  const goldenRatio = (1 + Math.sqrt(5)) / 2;

  for (let i = 0; i < count; i++) {
    const theta = (2 * Math.PI * i) / goldenRatio;
    const phi = Math.acos(1 - (2 * (i + 0.5)) / count);

    points.push([
      Math.sin(phi) * Math.cos(theta) * radius,
      Math.sin(phi) * Math.sin(theta) * radius,
      Math.cos(phi) * radius,
    ]);
  }

  return points;
}
