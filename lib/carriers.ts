import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PLAN_LIMITS: Record<string, number> = {
  free: 100,
  basic: 5000,
  pro: 50000,
  business: 999999,
}

export async function checkAndIncrementUsage(
  apiKey: string
): Promise<{ allowed: boolean; reason?: string }> {
  const { data, error } = await supabase
    .from("momo_api_keys")
    .select("*")
    .eq("key", apiKey)
    .single()

  if (error || !data) return { allowed: false, reason: "Invalid API key" }

  const today = new Date().toISOString().split("T")[0]
  if (data.last_reset !== today) {
    await supabase
      .from("momo_api_keys")
      .update({ calls_today: 0, last_reset: today })
      .eq("key", apiKey)
    data.calls_today = 0
  }

  const limit = PLAN_LIMITS[data.plan] ?? 100
  if (data.calls_today >= limit)
    return {
      allowed: false,
      reason: `Daily limit of ${limit} calls reached for ${data.plan} plan`,
    }

  await supabase
    .from("api_keys")
    .update({ calls_today: data.calls_today + 1 })
    .eq("key", apiKey)

  return { allowed: true }
}

export const CARRIERS: Record<string, any> = {
  UG: {
    name: "Uganda",
    currency: "UGX",
    dial_code: "+256",
    carriers: {
      "MTN Uganda":     { prefixes: ["077","078","076","039"], mobile_money: true,  service: "MTN MoMo" },
      "Airtel Uganda":  { prefixes: ["070","075","074"],       mobile_money: true,  service: "Airtel Money" },
      "Africel":        { prefixes: ["079"],                   mobile_money: false, service: null },
      "Uganda Telecom": { prefixes: ["071"],                   mobile_money: false, service: null },
    },
  },
  KE: {
    name: "Kenya",
    currency: "KES",
    dial_code: "+254",
    carriers: {
      "Safaricom":    { prefixes: ["0722","0723","0729","0110","0111","0112","0113","0114","0115"], mobile_money: true,  service: "M-Pesa" },
      "Airtel Kenya": { prefixes: ["0733","0734","0735","0736","0737"],                            mobile_money: true,  service: "Airtel Money" },
      "Telkom Kenya": { prefixes: ["0777","0778","0779"],                                          mobile_money: true,  service: "T-Kash" },
    },
  },
  NG: {
    name: "Nigeria",
    currency: "NGN",
    dial_code: "+234",
    carriers: {
      "MTN Nigeria":    { prefixes: ["0803","0806","0703","0706","0813","0816","0810","0814","0903","0906"], mobile_money: true,  service: "MTN MoMo" },
      "Airtel Nigeria": { prefixes: ["0802","0808","0708","0812","0701","0902","0907"],                      mobile_money: true,  service: "Airtel Money" },
      "Glo Mobile":     { prefixes: ["0805","0807","0705","0815","0811","0905"],                            mobile_money: false, service: null },
      "9mobile":        { prefixes: ["0809","0817","0818","0909","0908"],                                   mobile_money: false, service: null },
    },
  },
  TZ: {
    name: "Tanzania",
    currency: "TZS",
    dial_code: "+255",
    carriers: {
      "Vodacom Tanzania": { prefixes: ["0741","0742","0743","0744","0745"], mobile_money: true, service: "M-Pesa" },
      "Airtel Tanzania":  { prefixes: ["0683","0685","0686","0787"],        mobile_money: true, service: "Airtel Money" },
      "Tigo Tanzania":    { prefixes: ["0711","0712","0713","0714","0715"], mobile_money: true, service: "Tigo Pesa" },
      "Halotel":          { prefixes: ["0621","0622","0623"],               mobile_money: true, service: "HaloPesa" },
    },
  },
  GH: {
    name: "Ghana",
    currency: "GHS",
    dial_code: "+233",
    carriers: {
      "MTN Ghana":        { prefixes: ["024","054","055","059"], mobile_money: true, service: "MTN MoMo" },
      "Vodafone Ghana":   { prefixes: ["020","050"],             mobile_money: true, service: "Vodafone Cash" },
      "AirtelTigo Ghana": { prefixes: ["027","057","026","056"], mobile_money: true, service: "AirtelTigo Money" },
    },
  },
}

export function normalizeNumber(phone: string, dialCode: string): string {
  let p = phone.trim().replace(/[\s\-]/g, "")
  const raw = dialCode.replace("+", "")
  if (p.startsWith("+")) p = "0" + p.slice(dialCode.length)
  else if (p.startsWith(raw)) p = "0" + p.slice(raw.length)
  else if (!p.startsWith("0")) p = "0" + p
  return p
}

export function lookupCarrier(phone: string, countryCode: string) {
  const cc = countryCode.toUpperCase()
  const country = CARRIERS[cc]
  if (!country) return null

  const local = normalizeNumber(phone, country.dial_code)

  for (const [carrierName, info] of Object.entries<any>(country.carriers)) {
    for (const prefix of info.prefixes) {
      if (local.startsWith(prefix)) {
        return {
          valid: true,
          phone_local: local,
          phone_international: country.dial_code + local.slice(1),
          country: country.name,
          country_code: cc,
          carrier: carrierName,
          prefix,
          mobile_money: info.mobile_money,
          mobile_money_service: info.service,
          currency: country.currency,
        }
      }
    }
  }

  return {
    valid: false,
    phone_local: local,
    country: country.name,
    country_code: cc,
    carrier: null,
    error: "Phone prefix not recognised for this country",
  }
}
