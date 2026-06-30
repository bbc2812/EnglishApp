// FSRS-4.5 algorithm — https://github.com/open-spaced-repetition/fsrs4anki
// w0–w18: default parameters from the paper
const W = [
    0.4072, 1.1829, 3.1262, 15.4722, 7.2102, 0.5316, 1.0651, 0.0589,
    1.3171, 0.1544, 1.0, 1.9395, 0.1100, 0.2900, 2.2700, 0.1500,
    2.9898, 0.5100, 0.43
];
const DECAY = -0.5;
const FACTOR = 0.9 ** (1 / DECAY) - 1;
function clamp(x, lo, hi) {
    return Math.min(hi, Math.max(lo, x));
}
function initStability(r) {
    return Math.max(W[r - 1], 0.1);
}
function initDifficulty(r) {
    return clamp(W[4] - Math.exp(W[5] * (r - 1)) + 1, 1, 10);
}
function retrievability(elapsedDays, stability) {
    return (1 + FACTOR * (elapsedDays / stability)) ** DECAY;
}
function nextInterval(stability, requestRetention = 0.9) {
    const interval = (stability / FACTOR) * (requestRetention ** (1 / DECAY) - 1);
    return Math.max(1, Math.round(interval));
}
function nextDifficulty(d, r) {
    const deltaD = -W[6] * (r - 3);
    return clamp(W[7] * initDifficulty(1) + (1 - W[7]) * (d + deltaD), 1, 10);
}
function shortTermStability(s, r) {
    return s * Math.exp(W[17] * (r - 3 + W[18]));
}
function nextRecallStability(d, s, r_, rating) {
    const hardPenalty = rating === 2 ? W[15] : 1;
    const easyBonus = rating === 4 ? W[16] : 1;
    return (s *
        (Math.exp(W[8]) *
            (11 - d) *
            Math.pow(s, -W[9]) *
            (Math.exp((1 - r_) * W[10]) - 1) *
            hardPenalty *
            easyBonus +
            1));
}
function nextForgetStability(d, s, r_) {
    return W[11] * Math.pow(d, -W[12]) * (Math.pow(s + 1, W[13]) - 1) * Math.exp((1 - r_) * W[14]);
}
function addDays(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
}
export function schedule(card, rating) {
    const now = new Date().toISOString().slice(0, 10);
    const elapsed = card.last_review
        ? Math.max(0, Math.floor((Date.now() - new Date(card.last_review).getTime()) / 86_400_000))
        : 0;
    let { stability, difficulty, reps, lapses } = card;
    let scheduledDays = 0;
    let nextState = card.state;
    if (card.state === 'new') {
        stability = initStability(rating);
        difficulty = initDifficulty(rating);
        if (rating === 1) {
            scheduledDays = 0;
            nextState = 'learning';
        }
        else if (rating === 2) {
            scheduledDays = 1;
            nextState = 'learning';
        }
        else {
            scheduledDays = nextInterval(stability);
            nextState = 'review';
        }
        reps = 1;
    }
    else if (card.state === 'learning' || card.state === 'relearning') {
        stability = shortTermStability(stability, rating);
        difficulty = nextDifficulty(difficulty, rating);
        if (rating === 1) {
            scheduledDays = 0;
            nextState = card.state;
        }
        else {
            scheduledDays = nextInterval(stability);
            nextState = 'review';
        }
        reps += 1;
    }
    else {
        // review
        const r_ = retrievability(elapsed, stability);
        difficulty = nextDifficulty(difficulty, rating);
        if (rating === 1) {
            stability = nextForgetStability(difficulty, stability, r_);
            scheduledDays = 0;
            lapses += 1;
            nextState = 'relearning';
        }
        else {
            stability = nextRecallStability(difficulty, stability, r_, rating);
            scheduledDays = nextInterval(stability);
            nextState = 'review';
        }
        reps += 1;
    }
    return {
        stability: Math.max(stability, 0.1),
        difficulty: clamp(difficulty, 1, 10),
        elapsed_days: elapsed,
        scheduled_days: scheduledDays,
        reps,
        lapses,
        state: nextState,
        last_review: now,
        due_date: addDays(scheduledDays)
    };
}
