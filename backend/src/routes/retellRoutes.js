
import { Router } from "express";
import {
  listVoices,
  createLLM,
  createAgent,
  getAgent,
  updateAgent,
  getLLM,
  createAgentForClinic,
  updateAgentPrompt,
  updateAgentProperties,
  handleCallEvent,
  playVoice,
} from "../controllers/retellWebhookController.js";
import {
  toolGetPatientByPhone,
  toolFindSlots,
  toolCreateAppointment,
  toolGetServices,
} from "../controllers/retellToolsController.js";
import {
  toolGetMenu,
  toolGetRestaurantCustomerByPhone,
  toolCheckTableAvailability,
  toolCreateReservation,
  toolPlaceOrder,
  toolGetOrderStatus,
} from "../controllers/retellRestaurantToolsController.js";

const router = Router();
// router.post("/agents", createAgentForClinic);
router.post("/webhooks/call-events", handleCallEvent);
router.post("/functions/get_patient_by_phone", toolGetPatientByPhone);
router.post("/functions/find_slots", toolFindSlots);
router.post("/functions/create_appointment", toolCreateAppointment);
router.post("/functions/get_services", toolGetServices);
router.post("/functions/get_customer_by_phone", toolGetRestaurantCustomerByPhone);
router.post("/functions/get_menu", toolGetMenu);
router.post("/functions/check_table_availability", toolCheckTableAvailability);
router.post("/functions/create_reservation", toolCreateReservation);
router.post("/functions/place_order", toolPlaceOrder);
router.post("/functions/get_order_status", toolGetOrderStatus);

/**
 * Create and Update Agent API APIs and their prerequisits
*/
router.get("/voices", listVoices);
router.post("/voices/play", playVoice); 
router.post("/llms", createLLM);
router.get("/llms/:llmId", getLLM);
router.post("/agents", createAgent);
router.get("/agents/:agentId", getAgent);
router.patch("/agents/:agentId", updateAgent);
router.patch("/agents/:agent_id/prompt", updateAgentPrompt);
router.patch("/agents/:agent_id", updateAgentProperties);

export default router;
