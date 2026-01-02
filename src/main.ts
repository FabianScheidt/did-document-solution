import { app } from "./server";
import * as process from "process";

const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});
