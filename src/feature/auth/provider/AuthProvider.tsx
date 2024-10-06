import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from 'react'
import type { User } from '@firebase/auth'
import { getAuth, onAuthStateChanged } from '@firebase/auth'
import { storage } from "@src/lib/firebase/firebase"
import { getDownloadURL, ref} from "firebase/storage"

export type GlobalAuthState = {
    user: User | null | undefined
    profileImageUrl: string | null
}
const initialState: GlobalAuthState = {
    user: undefined,
    profileImageUrl: null
}
const AuthContext = createContext<GlobalAuthState>(initialState)

type Props = { children: ReactNode }

export const AuthProvider = ({ children }: Props) => {
    // const [user, setUser] = useState<GlobalAuthState>(initialState)
    const [authState, setAuthState] = useState<GlobalAuthState>(initialState)

useEffect(() => {
    try {
        const auth = getAuth()
        return onAuthStateChanged(auth, async (user) => {
            if (user) {
                const imageRef = ref(storage, `images/${user.uid}`)
                const profileImageUrl = await getDownloadURL(imageRef)

                setAuthState({
                    user, 
                    profileImageUrl,
                })
            } else {
                setAuthState(initialState)
            }
        })
    } catch (error) {
        setAuthState(initialState)
        throw error
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, [])

return <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>
}

export const useAuthContext = () => useContext(AuthContext)