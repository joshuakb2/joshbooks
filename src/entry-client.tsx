import { mount, StartClient } from "@solidjs/start/client";
import './moduleAugmentation';

mount(() => <StartClient />, document.getElementById("app")!);
