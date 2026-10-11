#!/bin/sh
# workerd hangs under libfaketime: the stand at another hour starts it with the real clock, and its
# Worker moves its own clock by the same shift (stand-hour.mjs, shift-clock.mjs).
unset LD_PRELOAD
exec "$STAND_WORKERD" "$@"
