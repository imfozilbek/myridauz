import { configure } from '@testing-library/react';

// The first screen of a test file loads TelegramUI; in the full run with coverage on a busy
// CI machine this can take longer than the default 1 s of findBy*, so waits get 5 s.
const ASYNC_WAIT_MS = 5000;
configure({ asyncUtilTimeout: ASYNC_WAIT_MS });
