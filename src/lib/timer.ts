export async function startCountdown(seconds: number) {
  let counter = seconds;

  const interval = setInterval(() => {
    console.log(counter + '');
    counter--;

    if (counter < 0) {
      clearInterval(interval);
      console.log("Time's up!");
    }
  }, 1000);
}
