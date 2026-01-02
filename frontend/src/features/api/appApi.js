import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "./axiosBaseQuery";

export const appApi = createApi({
  reducerPath: "appApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: [
    "Voices",
    "Agents",
    "Prompts",
    "Calls",
    "Onboarding",
    "GoogleCalendar",
    "Appointments",
    "Patients",
    "Restaurants",
    "Clinics",
    "Menu",
    "Orders",
    "Upsells",
    "RestaurantSettings",
  ],
  endpoints: (builder) => ({
    getRestaurants: builder.query({
      query: () => ({ url: "/restaurants" }),
      transformResponse: (response) => response?.restaurants ?? [],
      providesTags: ["Restaurants"],
    }),
    getClinics: builder.query({
      query: () => ({ url: "/clinics" }),
      transformResponse: (response) => response?.clinics ?? [],
      providesTags: ["Clinics"],
    }),

    getRestaurantMenu: builder.query({
      query: (restaurantId) => ({ url: `/restaurants/${restaurantId}/menu` }),
      transformResponse: (response) => response?.items ?? [],
      providesTags: (result, error, restaurantId) => [
        { type: "Menu", id: restaurantId },
      ],
    }),

    createMenuItem: builder.mutation({
      query: ({ restaurantId, item }) => ({
        url: `/restaurants/${restaurantId}/menu-items`,
        method: "POST",
        data: item,
      }),
      invalidatesTags: (result, error, { restaurantId }) => [
        { type: "Menu", id: restaurantId },
      ],
    }),
    updateMenuItem: builder.mutation({
      query: ({ restaurantId, itemId, item }) => ({
        url: `/restaurants/${restaurantId}/menu-items/${itemId}`,
        method: "PATCH",
        data: item,
      }),
      invalidatesTags: (result, error, { restaurantId }) => [
        { type: "Menu", id: restaurantId },
      ],
    }),
    deleteMenuItem: builder.mutation({
      query: ({ restaurantId, itemId }) => ({
        url: `/restaurants/${restaurantId}/menu-items/${itemId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { restaurantId }) => [
        { type: "Menu", id: restaurantId },
      ],
    }),

    getRestaurantOrders: builder.query({
      query: (restaurantId) => ({ url: `/restaurants/${restaurantId}/orders` }),
      transformResponse: (response) => response?.orders ?? [],
      providesTags: (result, error, restaurantId) => [
        { type: "Orders", id: restaurantId },
      ],
    }),

    updateOrderStatus: builder.mutation({
      query: (payload) => {
        const { restaurantId, orderId, ...updates } = payload ?? {};
        return {
          url: `/restaurants/${restaurantId}/orders/${orderId}`,
          method: "PATCH",
          data: updates,
        };
      },
      invalidatesTags: (result, error, { restaurantId }) => [
        { type: "Orders", id: restaurantId },
      ],
    }),
    deleteOrder: builder.mutation({
      query: ({ restaurantId, orderId }) => ({
        url: `/restaurants/${restaurantId}/orders/${orderId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { restaurantId }) => [
        { type: "Orders", id: restaurantId },
      ],
    }),

    getRestaurantCustomers: builder.query({
      query: (restaurantId) => ({ url: `/restaurants/${restaurantId}/customers` }),
      transformResponse: (response) => response?.customers ?? [],
      providesTags: (result, error, restaurantId) => [
        { type: "Customers", id: restaurantId },
      ],
    }),

    getRestaurantUpsells: builder.query({
      query: (restaurantId) => ({ url: `/restaurants/${restaurantId}/upsells` }),
      transformResponse: (response) => response?.upsells ?? [],
      providesTags: (result, error, restaurantId) => [
        { type: "Upsells", id: restaurantId },
      ],
    }),

    getRestaurantAiSettings: builder.query({
      query: (restaurantId) => ({ url: `/restaurants/${restaurantId}/settings` }),
      transformResponse: (response) => response?.settings ?? { upsellPrompt: "" },
      providesTags: (result, error, restaurantId) => [
        { type: "RestaurantSettings", id: restaurantId },
      ],
    }),

    saveRestaurantAiSettings: builder.mutation({
      query: ({ restaurantId, settings }) => ({
        url: `/restaurants/${restaurantId}/settings`,
        method: "PUT",
        data: settings,
      }),
      invalidatesTags: (result, error, { restaurantId }) => [
        { type: "RestaurantSettings", id: restaurantId },
      ],
    }),
    refreshRestaurantPrompt: builder.mutation({
      query: (restaurantId) => ({
        url: `/restaurants/${restaurantId}/refresh-prompt`,
        method: "POST",
      }),
      invalidatesTags: (result, error, restaurantId) => [
        { type: "RestaurantSettings", id: restaurantId },
      ],
    }),

    // ============ VOICES ============
    getVoices: builder.query({
      query: () => ({ url: "/voices" }),
      transformResponse: (r) => r?.voices ?? [],
      providesTags: ["Voices"],
    }),

    // ============ AGENTS ============
    getAgents: builder.query({
      query: () => ({ url: "/agents" }),
      providesTags: ["Agents"],
    }),
    createAgent: builder.mutation({
      query: (body) => ({ url: "/agents", method: "POST", data: body }),
      invalidatesTags: ["Agents"],
    }),
    deleteAgent: builder.mutation({
      query: (id) => ({ url: `/agents/${id}`, method: "DELETE" }),
      invalidatesTags: ["Agents"],
    }),

    // ============ PROMPTS ============
    getPrompts: builder.query({
      query: () => ({ url: "/prompts" }),
      providesTags: ["Prompts"],
    }),
    createPrompt: builder.mutation({
      query: (body) => ({ url: "/prompts", method: "POST", data: body }),
      invalidatesTags: ["Prompts"],
    }),

    // ============ CALLS ============
    getCalls: builder.query({
      query: ({ page = 1, pageSize = 10, direction, status, from, to, search } = {}) => ({
        url: "/calls",
        params: {
          page,
          pageSize,
          ...(direction ? { direction } : {}),
          ...(status ? { status } : {}),
          ...(from ? { from } : {}),
          ...(to ? { to } : {}),
          ...(search ? { search } : {}),
        },
      }),
      providesTags: ["Calls"],
    }),
    createCall: builder.mutation({
      query: (body) => ({ url: "/calls", method: "POST", data: body }),
      invalidatesTags: ["Calls"],
    }),

    // ============ ONBOARDING ============
    getClinicOnboarding: builder.query({
      query: (clinicId) => ({ url: `/clinics/${clinicId}/onboarding` }),
      transformResponse: (response) => response?.onboarding ?? null,
      providesTags: (result, error, clinicId) => [
        { type: "Onboarding", id: clinicId },
      ],
    }),

    saveLocations: builder.mutation({
      query: ({ clinicId, locations }) => ({
        url: `/clinics/${clinicId}/locations`,
        method: "PUT",
        data: { locations },
      }),
      invalidatesTags: (result, error, { clinicId }) => [
        { type: "Onboarding", id: clinicId },
      ],
    }),

    saveProviders: builder.mutation({
      query: ({ clinicId, providers }) => ({
        url: `/clinics/${clinicId}/providers`,
        method: "PUT",
        data: { providers },
      }),
      invalidatesTags: (result, error, { clinicId }) => [
        { type: "Onboarding", id: clinicId },
      ],
    }),

    saveServices: builder.mutation({
      query: ({ clinicId, services }) => ({
        url: `/clinics/${clinicId}/services`,
        method: "PUT",
        data: { services },
      }),
      invalidatesTags: (result, error, { clinicId }) => [
        { type: "Onboarding", id: clinicId },
      ],
    }),

    saveAddOns: builder.mutation({
      query: ({ clinicId, addOns }) => ({
        url: `/clinics/${clinicId}/add-ons`,
        method: "PUT",
        data: { addOns },
      }),
      invalidatesTags: (result, error, { clinicId }) => [
        { type: "Onboarding", id: clinicId },
      ],
    }),

    saveInsurance: builder.mutation({
      query: ({ clinicId, insurance }) => ({
        url: `/clinics/${clinicId}/insurance`,
        method: "PUT",
        data: { insurance },
      }),
      invalidatesTags: (result, error, { clinicId }) => [
        { type: "Onboarding", id: clinicId },
      ],
    }),

    savePolicies: builder.mutation({
      query: ({ clinicId, policies }) => ({
        url: `/clinics/${clinicId}/policies`,
        method: "PUT",
        data: { policies },
      }),
      invalidatesTags: (result, error, { clinicId }) => [
        { type: "Onboarding", id: clinicId },
      ],
    }),

    saveMessaging: builder.mutation({
      query: ({ clinicId, messaging }) => ({
        url: `/clinics/${clinicId}/messaging`,
        method: "PUT",
        data: { messaging },
      }),
      invalidatesTags: (result, error, { clinicId }) => [
        { type: "Onboarding", id: clinicId },
      ],
    }),

    selectVoice: builder.mutation({
      query: ({ clinicId, voice_id }) => ({
        url: `/clinics/${clinicId}/voice`,
        method: "PATCH",
        data: { voice_id },
      }),
      invalidatesTags: (result, error, { clinicId }) => [
        { type: "Onboarding", id: clinicId },
      ],
    }),

    setSectionCompletion: builder.mutation({
      query: ({ clinicId, section, completed = true }) => ({
        url: `/clinics/${clinicId}/sections`,
        method: "PATCH",
        data: { section, completed },
      }),
      invalidatesTags: (result, error, { clinicId }) => [
        { type: "Onboarding", id: clinicId },
      ],
    }),

    finishOnboarding: builder.mutation({
      query: ({ clinicId }) => ({
        url: `/clinics/${clinicId}/finish`,
        method: "POST",
      }),
      invalidatesTags: (result, error, { clinicId }) => [
        { type: "Onboarding", id: clinicId },
        "Agents",
      ],
    }),

    getGoogleCalendarStatus: builder.query({
      query: (clinicId) => ({ url: `/clinics/${clinicId}/google/status` }),
      providesTags: (result, error, clinicId) => [
        { type: "GoogleCalendar", id: clinicId },
      ],
    }),

    getClinicAppointments: builder.query({
      query: (clinicId) => ({ url: `/clinics/${clinicId}/appointments` }),
      transformResponse: (response) => response?.appointments ?? [],
      providesTags: (result, error, clinicId) => [
        { type: "Appointments", id: clinicId },
      ],
    }),

    getClinicPatients: builder.query({
      query: (clinicId) => ({ url: `/clinics/${clinicId}/patients` }),
      transformResponse: (response) => response?.patients ?? [],
      providesTags: (result, error, clinicId) => [
        { type: "Patients", id: clinicId },
      ],
    }),
  }),
});

export const {
  useGetRestaurantsQuery,
  useGetClinicsQuery,
  useGetRestaurantMenuQuery,
  useCreateMenuItemMutation,
  useUpdateMenuItemMutation,
  useDeleteMenuItemMutation,
  useGetRestaurantOrdersQuery,
  useUpdateOrderStatusMutation,
  useDeleteOrderMutation,
  useGetRestaurantCustomersQuery,
  useGetRestaurantUpsellsQuery,
  useGetRestaurantAiSettingsQuery,
  useSaveRestaurantAiSettingsMutation,
  useRefreshRestaurantPromptMutation,
  // Voices
  useGetVoicesQuery,
  // Agents
  useGetAgentsQuery,
  useCreateAgentMutation,
  useDeleteAgentMutation,
  // Prompts
  useGetPromptsQuery,
  useCreatePromptMutation,
  // Calls
  useGetCallsQuery,
  useCreateCallMutation,
  // Onboarding
  useGetClinicOnboardingQuery,
  useSaveLocationsMutation,
  useSaveProvidersMutation,
  useSaveServicesMutation,
  useSaveAddOnsMutation,
  useSaveInsuranceMutation,
  useSavePoliciesMutation,
  useSaveMessagingMutation,
  useSelectVoiceMutation,
  useSetSectionCompletionMutation,
  useFinishOnboardingMutation,
  useGetGoogleCalendarStatusQuery,
  useLazyGetGoogleCalendarStatusQuery,
  useGetClinicAppointmentsQuery,
  useGetClinicPatientsQuery,
} = appApi;
