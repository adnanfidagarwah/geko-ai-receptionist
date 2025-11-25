import { Save, Upload } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "../../lib/http";

const BusinessInformation = () => {
  const [logo, setLogo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formValues, setFormValues] = useState({
    businessName: "",
    phoneNumber: "",
    email: "",
    website: "",
    description: "",
  });

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogo(URL.createObjectURL(file));
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data } = await api.get("/auth/me");
        if (!isMounted) return;

        const user = data?.user ?? {};
        const activeOrg = data?.activeOrg ?? {};

        setFormValues({
          businessName: activeOrg?.name || "",
          phoneNumber: activeOrg?.phone || user?.phone || "",
          email: user?.email || "",
          website: activeOrg?.website || "",
          description: activeOrg?.description || "",
        });
      } catch (err) {
        if (!isMounted) return;
        const message =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load profile.";
        setError(message);
        toast.error(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    toast.info("Profile updates coming soon.");
  };

  return (
    <>
      <div className="flex flex-col items-center mb-6">
        <div className="relative group">
          <div className="h-32 w-32 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm">
            {logo ? (
              <img
                src={logo}
                alt="Logo Preview"
                className="h-full w-full object-cover rounded-full"
              />
            ) : (
              <Upload className="h-8 w-8 text-gray-400 group-hover:text-gray-600 transition" />
            )}
          </div>
          <label
            htmlFor="logo-upload"
            className="absolute bottom-1 right-1 bg-primary text-white rounded-full p-2 cursor-pointer shadow hover:bg-primary-dark transition"
          >
            <Upload className="h-4 w-4" />
          </label>
          <input
            type="file"
            id="logo-upload"
            accept="image/*"
            className="hidden"
            onChange={handleLogoChange}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Upload your business logo (PNG or JPG)
        </p>
      </div>

      {isLoading ? (
        <div className="text-sm text-textcolor-secondary">Loading profile…</div>
      ) : null}
      {error ? (
        <div className="text-sm text-red-500">{error}</div>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Business Name
            </label>
            <input
              type="text"
              name="businessName"
              placeholder="Enter business name"
              value={formValues.businessName}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-100 bg-gray-100 px-4 py-2 text-sm text-primary placeholder-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/30 transition"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              name="phoneNumber"
              placeholder="+1 (555) 123-4567"
              value={formValues.phoneNumber}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-100 bg-gray-100 px-4 py-2 text-sm text-primary placeholder-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/30 transition"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter email address"
              value={formValues.email}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-100 bg-gray-100 px-4 py-2 text-sm text-primary placeholder-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/30 transition"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Website URL
            </label>
            <input
              type="url"
              name="website"
              placeholder="Enter website URL"
              value={formValues.website}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-100 bg-gray-100 px-4 py-2 text-sm text-primary placeholder-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/30 transition"
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Description
          </label>
          <textarea
            rows={3}
            name="description"
            placeholder="Additional notes (optional)"
            value={formValues.description}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-100 bg-gray-100 px-4 py-2 text-sm text-primary placeholder-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/30 transition"
            disabled={isLoading}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-primary text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-primary-dark transition"
          >
            <Save className="h-5 w-5 text-white" />
            Save Changes
          </button>
        </div>
      </form>
    </>
  );
};

export default BusinessInformation;
