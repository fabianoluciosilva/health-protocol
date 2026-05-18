export function getWaterGoal(isTrainingDay: boolean): number {
  return isTrainingDay ? 3000 : 2500;
}
