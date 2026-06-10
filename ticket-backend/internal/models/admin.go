package models

type AdminStats struct {
	TotalEvents    int             `json:"total_events"`
	TotalOrders    int             `json:"total_orders"`
	TotalUsers     int             `json:"total_users"`
	TotalRevenue   float64         `json:"total_revenue"`
	OrdersByStatus map[string]int  `json:"orders_by_status"`
}
