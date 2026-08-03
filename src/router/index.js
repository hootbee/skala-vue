import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'home', component: () => import('../views/MainDashboardView.vue') },
  { path: '/weather', name: 'weather', component: () => import('../views/WeatherHomeView.vue') },
  { path: '/about', name: 'about', component: () => import('../views/WeatherAboutView.vue') },
  { path: '/stocks', name: 'stocks', component: () => import('../views/StockChartView.vue') },
  { path: '/subscribe', name: 'subscribe', component: () => import('../views/SubscriptionCheckoutView.vue') },
  { path: '/weather/:cityId', name: 'weather-detail', component: () => import('../views/WeatherDetailView.vue') },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../views/NotFoundView.vue') },
]

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})
