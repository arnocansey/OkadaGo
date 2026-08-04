"use client"

import * as React from "react"

const MOBILE = 768
const TABLET = 1024

export function useBreakpoint() {
  const [bp, setBp] = React.useState<{ isMobile: boolean; isTablet: boolean; isDesktop: boolean }>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  })

  React.useEffect(() => {
    const mqlMobile = window.matchMedia(`(max-width: ${MOBILE - 1}px)`)
    const mqlTablet = window.matchMedia(`(max-width: ${TABLET - 1}px)`)

    const update = () => {
      const w = window.innerWidth
      setBp({
        isMobile: w < MOBILE,
        isTablet: w >= MOBILE && w < TABLET,
        isDesktop: w >= TABLET,
      })
    }

    mqlMobile.addEventListener("change", update)
    mqlTablet.addEventListener("change", update)
    update()
    return () => {
      mqlMobile.removeEventListener("change", update)
      mqlTablet.removeEventListener("change", update)
    }
  }, [])

  return bp
}
