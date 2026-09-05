import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const adminEmail = Deno.env.get("ADMIN_EMAIL");

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      throw new Error("Supabase environment variables are missing.");
    }

    // Client using the logged-in admin's token
    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: req.headers.get("Authorization") || "",
        },
      },
    });

    // Admin client
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Check logged-in user
    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized. Please login as admin.",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Check that this is the admin account
    if (
      !adminEmail ||
      !user.email ||
      user.email.toLowerCase() !== adminEmail.toLowerCase()
    ) {
      return new Response(
        JSON.stringify({
          error: "Only the administrator can manage colleges.",
        }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const body = await req.json();

    const {
      action,
      collegeId,
      name,
      portal_title,
      username,
      password,
      is_active,
      logo_url,
      cover_image_url,
    } = body;

    // =====================================================
    // CREATE COLLEGE
    // =====================================================

    if (action === "create") {
      if (!name || !portal_title || !username || !password) {
        throw new Error(
          "College name, portal title, username and password are required."
        );
      }

      // Check username already exists
      const { data: existingCollege, error: existingError } =
        await supabaseAdmin
          .from("colleges")
          .select("id")
          .eq("username", username)
          .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      if (existingCollege) {
        throw new Error("This college username already exists.");
      }

      // Internal email used only for Supabase Auth
      const authEmail = `${username}@college.egyan.internal`;

      // Create Auth user
      const { data: authData, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email: authEmail,
          password: password,
          email_confirm: true,
        });

      if (authError) {
        throw authError;
      }

      const authUser = authData.user;

      if (!authUser) {
        throw new Error("Unable to create authentication user.");
      }

      try {
        // Create college
        const { data: college, error: collegeError } = await supabaseAdmin
          .from("colleges")
          .insert([
            {
              name: name,
              portal_title: portal_title,
              username: username,
              logo_url: logo_url || null,
              cover_image_url: cover_image_url || null,
              is_active: is_active ?? true,
            },
          ])
          .select()
          .single();

        if (collegeError) {
          throw collegeError;
        }

        // Connect Auth user to college
        const { error: mappingError } = await supabaseAdmin
          .from("college_users")
          .insert([
            {
              college_id: college.id,
              user_id: authUser.id,
            },
          ]);

        if (mappingError) {
          throw mappingError;
        }

        return new Response(
          JSON.stringify({
            success: true,
            college: college,
          }),
          {
            status: 200,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      } catch (dbError) {
        // Roll back Auth user if database operation fails
        await supabaseAdmin.auth.admin.deleteUser(authUser.id);

        throw dbError;
      }
    }

    // =====================================================
    // UPDATE COLLEGE
    // =====================================================

    if (action === "update") {
      if (!collegeId) {
        throw new Error("College ID is required.");
      }

      // Get college
      const { data: college, error: collegeError } = await supabaseAdmin
        .from("colleges")
        .select("*")
        .eq("id", collegeId)
        .single();

      if (collegeError) {
        throw collegeError;
      }

      // Get connected Auth user
      const { data: collegeUser, error: collegeUserError } = await supabaseAdmin
        .from("college_users")
        .select("user_id")
        .eq("college_id", collegeId)
        .single();

      if (collegeUserError) {
        throw collegeUserError;
      }

      // If username changed, update internal Auth email
      if (username) {
        const authEmail = `${username}@college.egyan.internal`;

        const authUpdate = {
          email: authEmail,
          ...(password ? { password: password } : {}),
        };

        const { error: authUpdateError } =
          await supabaseAdmin.auth.admin.updateUserById(
            collegeUser.user_id,
            authUpdate
          );

        if (authUpdateError) {
          throw authUpdateError;
        }
      } else if (password) {
        const { error: passwordError } =
          await supabaseAdmin.auth.admin.updateUserById(collegeUser.user_id, {
            password: password,
          });

        if (passwordError) {
          throw passwordError;
        }
      }

      // Update college information
      const updateData: any = {
        name: name,
        portal_title: portal_title,
        username: username,
        is_active: is_active,
      };

      if (logo_url) {
        updateData.logo_url = logo_url;
      }

      if (cover_image_url) {
        updateData.cover_image_url = cover_image_url;
      }

      const { error: updateError } = await supabaseAdmin
        .from("colleges")
        .update(updateData)
        .eq("id", collegeId);

      if (updateError) {
        throw updateError;
      }

      return new Response(
        JSON.stringify({
          success: true,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    throw new Error("Invalid action.");
  } catch (error) {
    console.error("MANAGE COLLEGE ERROR:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Something went wrong.",
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

//collegetest
