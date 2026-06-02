import { setCookie, getCookie as getCookieNext, deleteCookie } from 'cookies-next'

export const storeCookie = (key: string, plainText: string, expiredInDays: number) => {
    const maxAge = expiredInDays * 24 * 60 * 60
    return setCookie(key, plainText, { path: '/', maxAge: maxAge })
}

export const getCookie = (key: string) => {
    return getCookieNext(key) as string | undefined
}

export const removeCookie = (key: string) => {
    return deleteCookie(key, { path: '/' })
}

