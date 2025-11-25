import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQueryRetell } from "./axiosBaseQueryRetell";

export const retellApi = createApi({
  reducerPath: "retellApi",
  baseQuery: axiosBaseQueryRetell(),
  tagTypes: ["Voices", "Agents", "LLM"],
  endpoints: (builder) => ({
    // ====== Voices ======
    getVoices: builder.query({
      query: () => ({ url: "/voices" }),
      transformResponse: (r) => r?.voices ?? [],
      providesTags: ["Voices"],
    }),

    playVoice: builder.mutation({
      query: ({ voice_id, text, mode }) => ({
        url: "/voices/play",
        method: "POST",
        data: { voice_id, text, mode },
        responseType: "blob",
      }),
    }),

    // ====== LLM ======
    createLLM: builder.mutation({
      query: (body) => ({
        url: "/llms",
        method: "POST",
        data: body, // { general_prompt, model, s25_model }
      }),
      invalidatesTags: ["LLM"],
    }),

    getLlm: builder.query({
      query: (llmId) => ({ url: `/llms/${llmId}` }),
      transformResponse: (r) => r?.llm ?? null,
      providesTags: ["LLM"],
    }),

    // ====== Agents ======
    getAgents: builder.query({
      query: () => ({ url: "/agents" }),
      providesTags: ["Agents"],
    }),

    createAgent: builder.mutation({
      query: (body) => ({
        url: "/agents",
        method: "POST",
        data: body, // { agent, llm }
      }),
      invalidatesTags: ["Agents"],
    }),

    deleteAgent: builder.mutation({
      query: (id) => ({ url: `/agents/${id}`, method: "DELETE" }),
      invalidatesTags: ["Agents"],
    }),
  }),
});

export const {
  useGetVoicesQuery,
  usePlayVoiceMutation,
  useCreateLLMMutation,
  useGetLlmQuery,         // ✅ add this
  useGetAgentsQuery,
  useCreateAgentMutation,
  useDeleteAgentMutation,
} = retellApi;
