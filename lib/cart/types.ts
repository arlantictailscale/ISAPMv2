export type CartItemType = "event" | "hotel" | "webinar"

export interface CartItem {
  id: string
  cart_id: string
  item_type: CartItemType
  event_id?: string
  event_type?: string
  event_label?: string
  event_name?: string
  participant_type?: string
  participant_type_id?: string
  participant_type_label?: string
  hotel_room_type?: string
  check_in_date?: string
  check_out_date?: string
  nights?: number
  unit_price: number
  currency: string
  created_at: string
  is_bonus_item?: boolean
  bonus_source?: string
  original_price?: number
}

export interface Cart {
  id: string
  user_id: string
  status: "active" | "checked_out" | "abandoned"
  created_at: string
  updated_at: string
  items?: CartItem[]
}

export interface CartSummary {
  subtotal: number
  currency: string
  itemCount: number
  items: CartItem[]
}
