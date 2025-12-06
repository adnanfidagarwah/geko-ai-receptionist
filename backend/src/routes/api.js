
import { Router } from "express";
import { register, login, registerWithOrg, getProfile, logout } from "../controllers/authController.js";
import { authRequired } from "../middlewares/auth.js";
import { requireOrgRole } from "../middlewares/authz.js";
import {
  listRestaurants,
  createRestaurant,
  listMenu,
  createMenuItem,
  listClinics,
  createClinic,
  listOrdersByRestaurant,
  updateOrder,
  listAppointmentsByClinic,
  listPatientsByClinic,
  listCustomersByRestaurant,
  listUpsellsByRestaurant,
  getRestaurantSettings,
  saveRestaurantSettings,
} from "../controllers/businessController.js";
import { listCalls, createOutboundCall } from "../controllers/callController.js";
import {
  listWorkingHours,
  addWorkingHour,
  replaceWorkingHoursForWeekday,
  deleteWorkingHour,
  listWorkingBreaks,
  addWorkingBreak,
  replaceWorkingBreaksForWeekday,
  deleteWorkingBreak,
  replaceWorkingHoursBulk,
} from "../controllers/clinicScheduleController.js";  // <-- note the .. not .

const router = Router();

router.post("/auth/register", register);
router.post("/auth/register-owner", registerWithOrg);
router.post("/auth/login", login);
router.get("/auth/me", authRequired, getProfile);
router.post("/auth/logout", authRequired, logout);

router.get("/restaurants", listRestaurants);
router.post("/restaurants", authRequired, createRestaurant);
router.get("/restaurants/:id/menu", listMenu);
router.post("/restaurants/:id/menu-items", authRequired, requireOrgRole({ paramOrgId: "id", orgModel: "Restaurant", roles: ["owner", "manager"] }), createMenuItem);
router.get("/restaurants/:id/orders", listOrdersByRestaurant);
router.patch("/restaurants/:id/orders/:orderId", authRequired, requireOrgRole({ paramOrgId: "id", orgModel: "Restaurant", roles: ["owner", "manager"] }), updateOrder);
router.get("/restaurants/:id/customers", listCustomersByRestaurant);
router.get("/restaurants/:id/upsells", listUpsellsByRestaurant);
router.get(
  "/restaurants/:id/settings",
  authRequired,
  requireOrgRole({ paramOrgId: "id", orgModel: "Restaurant", roles: ["owner", "manager", "staff"] }),
  getRestaurantSettings,
);
router.put(
  "/restaurants/:id/settings",
  authRequired,
  requireOrgRole({ paramOrgId: "id", orgModel: "Restaurant", roles: ["owner", "manager", "staff"] }),
  saveRestaurantSettings,
);

router.get("/clinics", listClinics);
router.post("/clinics", authRequired, createClinic);
router.get("/clinics/:id/appointments", listAppointmentsByClinic);
router.get("/clinics/:id/patients", listPatientsByClinic);

import {
  getOnboarding,
  upsertLocations,
  upsertProviders,
  upsertServices,
  upsertAddOns,
  upsertInsurance,
  savePolicies,
  saveMessaging,
  setSelectedVoice,
  markSectionComplete,
  finishOnboarding
} from "../controllers/onboardingController.js";
import { getGoogleCalendarStatus } from "../controllers/googleCalendarController.js";

// ====== Clinic Working Hours ======
router.get(
    "/clinics/:clinicId/working-hours",
    listWorkingHours
);

router.post(
    "/clinics/:clinicId/working-hours",
    authRequired,
    requireOrgRole({ paramOrgId: "clinicId", orgModel: "Clinic", roles: ["owner", "manager"] }),
    addWorkingHour
);

router.put(
    "/clinics/:clinicId/working-hours/replace",
    authRequired,
    requireOrgRole({ paramOrgId: "clinicId", orgModel: "Clinic", roles: ["owner", "manager"] }),
    replaceWorkingHoursForWeekday
);

router.put(
    "/clinics/:clinicId/working-hours/bulk",
    authRequired,
    requireOrgRole({ paramOrgId: "clinicId", orgModel: "Clinic", roles: ["owner", "manager"] }),
    replaceWorkingHoursBulk
);

router.delete(
    "/clinics/:clinicId/working-hours/:hourId",
    authRequired,
    requireOrgRole({ paramOrgId: "clinicId", orgModel: "Clinic", roles: ["owner", "manager"] }),
    deleteWorkingHour
);

// ====== Clinic Working Breaks ======
router.get(
    "/clinics/:clinicId/working-breaks",
    listWorkingBreaks
);

router.post(
    "/clinics/:clinicId/working-breaks",
    authRequired,
    requireOrgRole({ paramOrgId: "clinicId", orgModel: "Clinic", roles: ["owner", "manager"] }),
    addWorkingBreak
);

router.put(
    "/clinics/:clinicId/working-breaks/replace",
    authRequired,
    requireOrgRole({ paramOrgId: "clinicId", orgModel: "Clinic", roles: ["owner", "manager"] }),
    replaceWorkingBreaksForWeekday
);

router.delete(
    "/clinics/:clinicId/working-breaks/:breakId",
    authRequired,
    requireOrgRole({ paramOrgId: "clinicId", orgModel: "Clinic", roles: ["owner", "manager"] }),
    deleteWorkingBreak
);

const orgGuard = [
  authRequired,
  requireOrgRole({ paramOrgId: "id", orgModel: "Clinic", roles: ["owner", "manager"] }),
];



router.get("/calls", authRequired, listCalls);
router.post("/calls", authRequired, createOutboundCall);

router.get("/clinics/:id/onboarding", authRequired, getOnboarding);
router.get("/clinics/:id/google/status", ...orgGuard, getGoogleCalendarStatus);

router.put("/clinics/:id/locations", ...orgGuard, upsertLocations);
router.put("/clinics/:id/providers", ...orgGuard, upsertProviders);
router.put("/clinics/:id/services", ...orgGuard, upsertServices);
router.put("/clinics/:id/add-ons", ...orgGuard, upsertAddOns);
router.put("/clinics/:id/insurance", ...orgGuard, upsertInsurance);
router.put("/clinics/:id/policies", ...orgGuard, savePolicies);
router.put("/clinics/:id/messaging", ...orgGuard, saveMessaging);

router.patch("/clinics/:id/voice", ...orgGuard, setSelectedVoice);
router.patch("/clinics/:id/sections", ...orgGuard, markSectionComplete);

router.post("/clinics/:id/finish", ...orgGuard, finishOnboarding);

export default router;
