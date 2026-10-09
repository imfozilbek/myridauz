// The limits of people from docs/127 §2..7 (G75): the brand gives the defaults, the owner changes them
// in «Cheklovlar» of the admin app (docs/128 §4); the server and the Mini Apps read the same values.

// A passenger waits for an answer to at most maxPending bookings; a driver answers in answerHours.
type BookingRules = { readonly maxPending: number; readonly answerHours: number };

// A passenger keeps at most maxOpen requests, each for 1 … maxSeats seats.
type RequestRules = { readonly maxOpen: number; readonly maxSeats: number };

// «Hamyon» turns red when the money confirms fewer than fewSeats seats (G65, docs/122).
type WalletRules = { readonly fewSeats: number };

// The chat and the call stay open afterTripHours after the arrival (docs/129).
type ChatRules = { readonly afterTripHours: number };

// «Xabar bering»: at most max live subscriptions; one for any date lives anyDateDays (docs/24).
type SubscriptionRules = { readonly max: number; readonly anyDateDays: number };

// The close ones who follow one trip (docs/43); the favorite drivers of a passenger (G18).
type ShareRules = { readonly followers: number };
type FavoriteRules = { readonly max: number };

// Ratings (docs/24, docs/129): rated within days; a review shows when both rated or after blindDays;
// one reminder after remindHours; «Yangi» below minShown; a moderator sees an average below lowAverage
// after lowCount ratings.
type RatingRules = {
  readonly days: number;
  readonly blindDays: number;
  readonly remindHours: number;
  readonly minShown: number;
  readonly lowAverage: number;
  readonly lowCount: number;
};

// Complaints (docs/17, docs/129): taken within days after the trip; hideAfter people in windowDays
// hide a person from the search.
type ComplaintRules = { readonly days: number; readonly hideAfter: number; readonly windowDays: number };

export type PeopleRules = {
  readonly bookings: BookingRules;
  readonly requests: RequestRules;
  readonly wallet: WalletRules;
  readonly chat: ChatRules;
  readonly subscriptions: SubscriptionRules;
  readonly shares: ShareRules;
  readonly favorites: FavoriteRules;
  readonly ratings: RatingRules;
  readonly complaints: ComplaintRules;
};
